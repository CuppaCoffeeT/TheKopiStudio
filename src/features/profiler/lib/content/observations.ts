/**
 * Profiler non-verbal observation groups — verbatim port of the legacy app's
 * `public/js/data.js`.
 *
 * PARITY CONTRACT (do not edit copy without a versioning decision — see PRD):
 * - Array orders are FROZEN: the NvItem ids are persisted in `public.results`
 *   rows.
 * - HTML entities from the legacy source are converted to literal unicode here
 *   (emoji are literal characters).
 */

import type { NvGroup } from '../../types';

/** The 5 non-verbal observation groups (53 items, ids a1–e16). */
export const NVG: readonly NvGroup[] = [
  {
    em: "🤚",
    tt: "First 30 Seconds",
    st: "Arrival, greeting, first impression",
    items: [
      { id: "a1", t: "Firm brief handshake - one pump, done", d: "D" },
      { id: "a2", t: "Warm handshake, two hands or touched arm", d: "I" },
      { id: "a3", t: "Gentle moderate grip, pleasant not a power move", d: "S" },
      { id: "a4", t: "Precise measured grip, just right pressure", d: "C" },
      { id: "a5", t: "Arrived early, came with notes or agenda", d: "C" },
      { id: "a6", t: "On time but still finishing a call or WhatsApp", d: "I" },
      { id: "a7", t: "Sharp status-signalling outfit, power dressing", d: "D" },
      { id: "a8", t: "Colourful, expressive, on-trend clothing", d: "I" },
      { id: "a9", t: "Comfortable classic understated - nothing flashy", d: "S" },
      { id: "a10", t: "Smart but functional, neat and conservative", d: "C" },
    ],
  },
  {
    em: "🚹",
    tt: "Posture & Energy",
    st: "How they sit and carry themselves",
    items: [
      { id: "b1", t: "Leans forward, takes up space confidently", d: "D" },
      { id: "b2", t: "Sits close, animated, comfortable with small distance", d: "I" },
      { id: "b3", t: "Slight angle, non-confrontational and calm", d: "S" },
      { id: "b4", t: "Sits slightly back, needs intellectual space", d: "C" },
      { id: "b5", t: "Arms crossed but body faces you - assertive not cold", d: "D" },
      { id: "b6", t: "Arms open, relaxed, genuinely warm", d: "S" },
      { id: "b7", t: "Very still, controlled posture, minimal fidgeting", d: "C" },
      { id: "b8", t: "Checks phone or watch when conversation drags", d: "D" },
      { id: "b9", t: "Taps fingers or table when things slow down", d: "D" },
    ],
  },
  {
    em: "👁",
    tt: "Eye Contact & Face",
    st: "What their face and eyes are communicating",
    items: [
      { id: "c1", t: "Strong direct eye contact, holds your gaze", d: "D" },
      { id: "c2", t: "Frequent warm eye contact, breaks away to scan room", d: "I" },
      { id: "c3", t: "Soft steady eye contact, caring not challenging", d: "S" },
      { id: "c4", t: "Intermittent, looks away while thinking", d: "C" },
      { id: "c5", t: "Minimal facial animation, neutral focused expression", d: "D" },
      { id: "c6", t: "Very animated face, eyebrows move, reactions visible", d: "I" },
      { id: "c7", t: "Pleasant subdued smile, genuine not performative", d: "S" },
      { id: "c8", t: "Slight frown while thinking - concentration not displeasure", d: "C" },
      { id: "c9", t: "Laughs easily, even at own jokes", d: "I" },
    ],
  },
  {
    em: "🗣",
    tt: "How They Speak",
    st: "Pace, tone and the questions they ask",
    items: [
      { id: "d1", t: "Fast pace, every word deliberate, no filler words", d: "D" },
      { id: "d2", t: "Fast-medium, enthusiastic bursts, may trail off", d: "I" },
      { id: "d3", t: "Slow measured, pauses before answering", d: "S" },
      { id: "d4", t: "Slow and precise, every word carefully chosen", d: "C" },
      { id: "d5", t: "Direct: What's the return? What's the catch?", d: "D" },
      { id: "d6", t: "Open: What do people usually do? What's the story?", d: "I" },
      { id: "d7", t: "Soft: What would happen if...? Is it safe to...?", d: "S" },
      { id: "d8", t: "Precise: Where does that figure come from?", d: "C" },
      { id: "d9", t: "Takes notes or asks to note things down", d: "C" },
    ],
  },
  {
    em: "📷",
    tt: "How They React to You",
    st: "Observable in any cafe, lobby or meeting room",
    items: [
      { id: "e1", t: "Cuts your intro short - gets to the point themselves", d: "D" },
      { id: "e2", t: "Asks about you first before talking about themselves", d: "I" },
      { id: "e3", t: "Lets you finish every sentence, does not interrupt", d: "S" },
      { id: "e4", t: "Asks a clarifying question before answering yours", d: "C" },
      { id: "e5", t: "Phone face down or fully away the whole meeting", d: "D" },
      { id: "e6", t: "Phone on table, glances at notifications casually", d: "I" },
      { id: "e7", t: "Phone away, fully present, unhurried energy", d: "S" },
      { id: "e8", t: "Pulled out pen or opened notes app to write things down", d: "C" },
      { id: "e9", t: "Ordered quickly and decisively - no deliberating", d: "D" },
      { id: "e10", t: "Chatted with server or made a comment about the place", d: "I" },
      { id: "e11", t: "Polite and patient with service staff, no fuss", d: "S" },
      { id: "e12", t: "Asked what something contained before ordering", d: "C" },
      { id: "e13", t: "Bag or wallet is premium, functional, low-key status", d: "D" },
      { id: "e14", t: "Accessories expressive - phone case, bag has personality", d: "I" },
      { id: "e15", t: "Brought something practical - notebook, folder, name cards", d: "C" },
      { id: "e16", t: "Reacted warmly when family or personal topic came up", d: "S" },
    ],
  },
];
