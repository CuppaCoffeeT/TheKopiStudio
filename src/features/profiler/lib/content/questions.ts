/**
 * Profiler wizard questions — v6 of the advisor's prototype
 * (`ProspectProfiler_Mobile (20) v6.html`, ported 2026-09-25). Until then this
 * was the legacy `public/js/data.js` set, i.e. prototype (17).
 *
 * v6 rewrote every question and option in Singapore English and SHUFFLED the
 * option order so the DISC letter can no longer be guessed from a row's
 * position. What it did NOT change is the scoring identity of an answer: each
 * question still has exactly one option per DISC letter, and every
 * (question, letter) pair carries the same MBTI pole it did in (17). A stored
 * answer is therefore identified by `(qi, d)`, and its `d` + `mb` are persisted
 * on the row — all that scoring and the stored-report replay ever read. `oi` is
 * only the row's position in the question set live when it was saved
 * (lib/decisions.md 2026-09-25). Guarded in `lib/__tests__/discovery.test.ts`.
 *
 * Flow position: Q0–6 are the RAPPORT questions (screens 1–2); Q7, the money
 * worry, is asked on the DISCOVERY screen as its "Money Anchor". `ph` is kept
 * as authored — the screens, not `ph`, decide where a question shows.
 */

import type { QsQuestion } from '../../types';

/** Rapport questions — screen 1 asks Q0–3, screen 2 asks Q4–6. */
export const RAPPORT_BATCHES: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [4, 5, 6],
];

/** The money-worry question, asked on the discovery screen. */
export const MONEY_ANCHOR_QI = 7;

/** The 8 wizard questions (7 rapport + the money anchor). */
export const QS: readonly QsQuestion[] = [
  {
    ph: "open",
    tip: "How they spend the weekend shows outgoing vs reserved — the recharge tell.",
    ask: "How's your weekend? What do you usually do?",
    opts: [
      { t: "Quite packed — gym, errands, things to settle", d: "D", mb: { k: "JP", v: "J" } },
      { t: "Went out — cannot stay home too long, sian", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Stayed home, my own time, my own things", d: "C", mb: { k: "JP", v: "P" } },
      { t: "Bit of both, but I need rest to recharge", d: "S", mb: { k: "EI", v: "I" } },
    ],
  },
  {
    ph: "open",
    tip: "Ask if they PREFER team or solo — the preference is the read, not the job.",
    ask: "At work, you usually work in a team or on your own? And do you prefer it that way?",
    opts: [
      { t: "With people — as long as I'm comfortable with them", d: "S", mb: { k: "TF", v: "F" } },
      { t: "My own — I prefer my own pace, my own style", d: "C", mb: { k: "EI", v: "I" } },
      { t: "With people — I don't like to tank everything alone", d: "I", mb: { k: "EI", v: "E" } },
      { t: "As long as it gets done, I don't mind either", d: "D", mb: { k: "TF", v: "T" } },
    ],
  },
  {
    ph: "open",
    tip: "How they share a win shows their core driver and confidence.",
    ask: "What's something good that happened lately — something you're quite happy about?",
    opts: [
      { t: "Quite excited telling it — the people, the whole story", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Tells it calmly — how it was done properly", d: "C", mb: { k: "TF", v: "T" } },
      { t: "Says it straight — the result, what got done", d: "D", mb: { k: "EI", v: "E" } },
      { t: "A bit paiseh — gives credit to family or team", d: "S", mb: { k: "TF", v: "F" } },
    ],
  },
  {
    ph: "open",
    tip: "What they want at work = core motivation = the DISC driver. Forward-framed.",
    ask: "Few years down the road in your career — what matters most to you?",
    opts: [
      { t: "To do solid work — proper, accurate, done well", d: "C", mb: { k: "SN", v: "N" } },
      { t: "Stable and steady — I don't like sudden surprises", d: "S", mb: { k: "SN", v: "S" } },
      { t: "Good people and environment — a team I enjoy", d: "I", mb: { k: "TF", v: "F" } },
      { t: "To move up — get ahead, reach the next level", d: "D", mb: { k: "TF", v: "T" } },
    ],
  },
  {
    ph: "discover",
    tip: "How they ended up in their job = how they make big life decisions.",
    ask: "How did you end up in your job — you planned it, or it just happened?",
    opts: [
      { t: "Through people I knew — kind of fell into it", d: "I", mb: { k: "SN", v: "N" } },
      { t: "After studies just took a job and carried on", d: "S", mb: { k: "SN", v: "S" } },
      { t: "I compared options properly, then chose", d: "C", mb: { k: "SN", v: "S" } },
      { t: "I chose it — even switched to get here", d: "D", mb: { k: "SN", v: "N" } },
    ],
  },
  {
    ph: "discover",
    tip: "Real passion shows personality more honestly than direct questions.",
    ask: "Outside work, what do you always make time for?",
    opts: [
      { t: "Something with a target — I like working towards something", d: "D", mb: { k: "TF", v: "T" } },
      { t: "One thing I really get into — I like to go deep", d: "C", mb: { k: "SN", v: "N" } },
      { t: "Family, and the usual things I'm comfortable with", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Meeting people — catch up, go out, not stay in", d: "I", mb: { k: "EI", v: "E" } },
    ],
  },
  {
    ph: "discover",
    tip: "Day-to-day planning style = Judging vs Perceiving. Their default, not holiday mode.",
    ask: "Day-to-day, you the type who plans everything, or more go with the flow?",
    opts: [
      { t: "Either can, but I like to know what's ahead", d: "I", mb: { k: "JP", v: "P" } },
      { t: "Go with the flow — too much planning is boring", d: "D", mb: { k: "JP", v: "P" } },
      { t: "Plan everything — schedule, budget, all sorted", d: "C", mb: { k: "JP", v: "J" } },
      { t: "Plan a bit, but I stay flexible", d: "S", mb: { k: "JP", v: "J" } },
    ],
  },
  {
    ph: "discover",
    tip: "Their real money worry = your emotional anchor for the whole conversation.",
    ask: "Be honest with me — what's the one money thing at the back of your mind?",
    opts: [
      { t: "I hear people talk about these things, but don't know the right amount to start", d: "C", mb: { k: "TF", v: "T" } },
      { t: "Honestly, I got no idea about all this", d: "I", mb: { k: "TF", v: "F" } },
      { t: "If something happens to me, how?", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Scared I'm missing chances — next time no money", d: "D", mb: { k: "SN", v: "N" } },
    ],
  },
];
