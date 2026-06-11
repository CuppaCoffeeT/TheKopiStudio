/**
 * Profiler feature types — flat file (never a types/ directory).
 *
 * The feature reads/writes the legacy `public.results` table byte-compatibly
 * (no schema changes this PRD) — re-export the generated DB types as the
 * single source of truth for row shapes. Content field names mirror the
 * legacy app's `public/js/data.js` byte-for-byte (shape parity contract
 * until cutover).
 */

import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/** A saved profiling result row (legacy `public.results` shape). */
export type ProfilerResult = Tables<'results'>;

/** Insert payload for `public.results` — must stay legacy-shape compatible. */
export type ProfilerResultInsert = TablesInsert<'results'>;

/** Update payload for `public.results` (notes editing). */
export type ProfilerResultUpdate = TablesUpdate<'results'>;

/** DISC behavioural letter — tie order D > I > S > C is significant in scoring. */
export type DiscLetter = 'D' | 'I' | 'S' | 'C';

/** MBTI dimension keys used by question options (`mb.k`). */
export type MbtiDimension = 'EI' | 'SN' | 'TF' | 'JP';

/** A single MBTI pole. Ties favour E/S/T/J in scoring. */
export type MbtiPole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/** Wizard question phase: rapport-opening vs discovery questions. */
export type QuestionPhase = 'open' | 'discover';

/** MBTI signal carried by a question option: dimension key + pole voted for. */
export interface MbtiSignal {
  k: MbtiDimension;
  v: MbtiPole;
}

/** One of the four answer options of a wizard question. */
export interface QsOption {
  /** Option copy shown to the advisor. */
  t: string;
  /** DISC letter this option votes for (+2 in scoring). */
  d: DiscLetter;
  /** MBTI pole this option votes for (+1 in scoring). */
  mb: MbtiSignal;
}

/** A wizard question. Each question's 4 options cover D/I/S/C exactly once. */
export interface QsQuestion {
  ph: QuestionPhase;
  /** Advisor-facing tip on what the question reveals. */
  tip: string;
  /** The question as the advisor asks it. */
  ask: string;
  /** Exactly 4 options; the option index (`oi`) is persisted in raw_answers — order is frozen. */
  opts: [QsOption, QsOption, QsOption, QsOption];
}

/** A non-verbal observation item. DISC only (+1 in scoring), no MBTI signal. */
export interface NvItem {
  /** Stable id (a1–a10, b1–b9, c1–c9, d1–d9, e1–e16) — persisted in nv_observations. */
  id: string;
  /** Observation copy. */
  t: string;
  /** DISC letter this observation votes for. */
  d: DiscLetter;
}

/** A group of non-verbal observations shown on one wizard screen. */
export interface NvGroup {
  /** Group emoji (literal unicode). */
  em: string;
  /** Group title. */
  tt: string;
  /** Group subtitle. */
  st: string;
  items: NvItem[];
}

/** Playbook category keys — display order is engage, appt, followup, objections, close. */
export type PlaybookCategoryKey = 'engage' | 'appt' | 'followup' | 'objections' | 'close';

/** A communication-playbook category: label + tap-to-copy statements. */
export interface PlaybookCategory {
  lbl: string;
  items: string[];
}

/** Full DISC profile content block for one primary letter. */
export interface DiscProfile {
  /** Profile name (e.g. "Dominant"). */
  nm: string;
  /** Profile emoji (literal unicode). */
  em: string;
  /** Hero gradient colour (hex). */
  col: string;
  /** Advisor Quick Read summary. */
  sg: string;
  /** Suggested opening line — the embedded double quotes are part of the copy. */
  op: string;
  /** Typical MBTI types line. */
  mb: string;
  /** 5 trait chips. */
  tr: string[];
  /** 5 "Do" items. */
  dos: string[];
  /** 4 "Avoid" items. */
  dnts: string[];
  /** Conversation style. */
  st: string;
  /** Red watch-for box copy. */
  wf: string;
  /** Follow-up style. */
  fu: string;
  /** Playbook: key order engage/appt/followup/objections/close with 5/5/5/6/5 items. */
  msgs: Record<PlaybookCategoryKey, PlaybookCategory>;
}

/** One answered wizard question as persisted in results.raw_answers. */
export interface RawAnswer {
  d: DiscLetter;
  mb: MbtiSignal;
  /** Option index (0–3) within the question's opts array. */
  oi: number;
}

/** A row of `public.results` in the legacy JSON shape (golden-master fixtures, scoring replay). */
export interface LegacyResultRow {
  id: string;
  user_id: string | null;
  advisor_name: string;
  prospect_name: string;
  age_range: string;
  occupation: string;
  /** Meeting stage as text: '1' Opening, '2' Presentation, '3' Closing, '4' Servicing. */
  meeting: string;
  disc_primary: DiscLetter;
  disc_secondary: DiscLetter;
  score_d: number;
  score_i: number;
  score_s: number;
  score_c: number;
  mbti: string;
  questions_answered: number;
  observations_count: number;
  raw_answers: RawAnswer[];
  /** Keyed by NvItem id; FALSE entries exist (ticked-then-unticked) — only TRUE counts. */
  nv_observations: Record<string, boolean>;
  notes: string;
  created_at: string;
  updated_at: string;
}
