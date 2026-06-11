/**
 * Profiler scoring — EXACT port of the legacy algorithm
 * (Prospect profiler `public/js/profiler.js` lines 117-142: `occNudge` + `calcPf`).
 *
 * This module is the frozen scoring contract, golden-master locked against all
 * 8 live `public.results` rows (see `__tests__/scoring.test.ts`). Do NOT
 * "fix" the quirks below — they are load-bearing for byte-compatibility with
 * results produced by the legacy app:
 *
 * - Occupation buckets use trailing-space tokens (`'it '`, `'md '`, `'gm '`,
 *   `'vp '`, `'pr '`, `'hr '`) so `'IT manager'` matches but `'it'` alone
 *   does not.
 * - `'care'` is a bare substring — it matches "career", "childcare", etc.
 * - `self.employ` keeps the legacy UNESCAPED dot (matches `self-employ`,
 *   `self employ`, `selfxemploy`, ...).
 * - Buckets STACK: one occupation can hit several buckets
 *   (`'IT manager'` hits buckets 1 and 5 → C+3 D+1, T+2 I+1).
 * - DISC tie-break is D > I > S > C for BOTH primary and secondary (the
 *   legacy relied on object insertion order + stable sort; encoded explicitly
 *   here).
 * - MBTI ties use `>=`, favouring E, S, T and J.
 *
 * Pure functions only — no JSX, no IO.
 */

import type { DiscLetter, RawAnswer } from '../types';
import { NVG } from './content';

export interface DiscScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

/** Signal tallies per MBTI pole (legacy `mb` object, same key set). */
export interface MbtiSignals {
  E: number;
  I: number;
  T: number;
  F: number;
  J: number;
  P: number;
  S: number;
  N: number;
}

/** The 16 possible MBTI results (`>=` ties collapse toward ESTJ). */
export type MbtiType = `${'E' | 'I'}${'S' | 'N'}${'T' | 'F'}${'J' | 'P'}`;

/** Return shape mirrors legacy `calcPf()` exactly. */
export interface ProfileResult {
  dc: DiscScores;
  mb: MbtiSignals;
  pri: DiscLetter;
  sec: DiscLetter;
  mbs: MbtiType;
  /** Count of ticked (TRUE) observations. */
  nvCount: number;
  /** Count of answered questions. */
  qCount: number;
  /** Occupation string that was fed into `occNudge` ('' when none). */
  occUsed: string;
}

/**
 * Observation id → DISC letter, derived from the content NVG (single source
 * of truth; ids are unique — guarded in the test suite). Legacy `calcPf`
 * walked NVG checking `ckNV[id]`; summation order is irrelevant, so a map
 * lookup is exactly equivalent.
 */
const NV_OBSERVATION_DISC: ReadonlyMap<string, DiscLetter> = new Map(
  NVG.flatMap((group) => group.items.map((item) => [item.id, item.d] as const)),
);

/** Explicit encoding of the legacy implicit tie order (object insertion). */
const DISC_TIE_ORDER: readonly DiscLetter[] = ['D', 'I', 'S', 'C'];

/**
 * Nudges DISC/MBTI tallies from the prospect's occupation. EXACT legacy port —
 * mutates `disc` and `mbti` in place (matching legacy call semantics); the
 * seven regex buckets are copied verbatim from `profiler.js` and stack.
 */
export function occNudge(disc: DiscScores, mbti: MbtiSignals, occupation: string): void {
  if (!occupation) return;
  const o = occupation.toLowerCase();
  if (/engineer|software|developer|it |data|analyst|analytic|auditor|accountant|accounting|scientist|research|actuari|statistic|architect|cybersec|network|database|quality|tester/.test(o)) {
    disc.C += 2; mbti.T++; mbti.I++;
  }
  if (/sales|business dev|entrepreneur|director|ceo|md |founder|gm |general manager|managing|vp |vice president|head of|chief|partner/.test(o)) {
    disc.D += 2; mbti.E++; mbti.T++;
  }
  if (/market|creative|design|artist|pr |public rel|events|media|influenc|content|performer|music|fashion|photog|social media|community/.test(o)) {
    disc.I += 2; mbti.E++; mbti.N++;
  }
  if (/teacher|educat|lecturer|professor|nurse|nursing|social work|counsell|therapist|psycholog|hr |human res|admin|customer serv|support|care|caregiv|welfare|nonprofit|volunteer/.test(o)) {
    disc.S += 2; mbti.F++; mbti.I++;
  }
  if (/lawyer|attorney|legal|solicitor|finance|banker|banking|investment|fund|consultant|advisor|adviser|manager|project|operations|compliance|risk/.test(o)) {
    disc.D++; disc.C++; mbti.T++;
  }
  if (/self.employ|freelanc|own business|business owner|sole prop|proprietor/.test(o)) {
    disc.D++; disc.I++; mbti.E++;
  }
  if (/doctor|physician|surgeon|specialist|pharmacist|dentist|optom|medical|clinic|hospital/.test(o)) {
    disc.C++; disc.D++; mbti.T++;
  }
}

/**
 * EXACT port of legacy `calcPf()`.
 *
 * @param answers      The 8 wizard answers (`results.raw_answers` shape);
 *                     unanswered slots are `null` and skipped.
 * @param observations Ids of observations ticked TRUE only (callers replaying
 *                     a stored `results.nv_observations` object must filter
 *                     out FALSE entries first). Each id scores +1 on its DISC
 *                     letter; every passed id counts in `nvCount`, matching
 *                     the legacy truthy-count.
 * @param occupation   Free-text occupation ('' disables the nudge).
 */
export function calcProfile(
  answers: ReadonlyArray<RawAnswer | null>,
  observations: readonly string[],
  occupation: string,
): ProfileResult {
  const dc: DiscScores = { D: 0, I: 0, S: 0, C: 0 };
  const mb: MbtiSignals = { E: 0, I: 0, T: 0, F: 0, J: 0, P: 0, S: 0, N: 0 };

  occNudge(dc, mb, occupation || '');

  for (const answer of answers) {
    if (!answer) continue;
    dc[answer.d] += 2;
    mb[answer.mb.v] += 1;
  }

  for (const id of observations) {
    const letter = NV_OBSERVATION_DISC.get(id);
    if (letter) dc[letter] += 1;
  }

  const ranked = [...DISC_TIE_ORDER].sort(
    (a, b) => dc[b] - dc[a] || DISC_TIE_ORDER.indexOf(a) - DISC_TIE_ORDER.indexOf(b),
  );

  const mbs: MbtiType = `${mb.E >= mb.I ? 'E' : 'I'}${mb.S >= mb.N ? 'S' : 'N'}${
    mb.T >= mb.F ? 'T' : 'F'
  }${mb.J >= mb.P ? 'J' : 'P'}` as MbtiType;

  return {
    dc,
    mb,
    pri: ranked[0],
    sec: ranked[1],
    mbs,
    nvCount: observations.length,
    qCount: answers.filter(Boolean).length,
    occUsed: occupation || '',
  };
}
