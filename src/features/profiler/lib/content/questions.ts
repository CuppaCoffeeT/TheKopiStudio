/**
 * Profiler wizard questions — verbatim port of the legacy app's `public/js/data.js`.
 *
 * PARITY CONTRACT (do not edit copy without a versioning decision — see PRD):
 * - Array orders and option order within each question are FROZEN: the option
 *   index (`oi`) is persisted in `public.results` rows.
 */

import type { QsQuestion } from '../../types';

/** The 8 wizard questions (4 "open" + 4 "discover"). */
export const QS: readonly QsQuestion[] = [
  {
    ph: "open",
    tip: "How they answer reveals Extravert vs Introvert straight away.",
    ask: "Weekend how? Got plans or just stone at home?",
    opts: [
      { t: "Out with friends, events, always something on", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Chill at home, rest, family time", d: "S", mb: { k: "EI", v: "I" } },
      { t: "Side project, gym, always productive", d: "D", mb: { k: "JP", v: "J" } },
      { t: "Research, read, sort things out", d: "C", mb: { k: "JP", v: "P" } },
    ],
  },
  {
    ph: "open",
    tip: "People person vs solo reveals trust-building approach needed.",
    ask: "You prefer working with people or doing things on your own?",
    opts: [
      { t: "Love working with others, energy from team", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Prefer to figure things out alone first", d: "C", mb: { k: "EI", v: "I" } },
      { t: "Lead the team, delegate, outcome matters most", d: "D", mb: { k: "TF", v: "T" } },
      { t: "Work together but care a lot about how people feel", d: "S", mb: { k: "TF", v: "F" } },
    ],
  },
  {
    ph: "open",
    tip: "How they share wins reveals core driver and confidence level.",
    ask: "What is something you are proud of lately - work or personal?",
    opts: [
      { t: "Shares boldly - results, numbers, achievements", d: "D", mb: { k: "EI", v: "E" } },
      { t: "Gets excited telling story - people, journey, feelings", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Modest - credits family or team more than self", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Talks about completing something properly", d: "C", mb: { k: "TF", v: "T" } },
    ],
  },
  {
    ph: "open",
    tip: "Core work motivation = core DISC driver. This tells you the pitch language to use.",
    ask: "At work, what actually gets you fired up?",
    opts: [
      { t: "Winning, hitting targets, being the best", d: "D", mb: { k: "TF", v: "T" } },
      { t: "The people, vibes, recognition, team energy", d: "I", mb: { k: "TF", v: "F" } },
      { t: "Stability, good teammates, knowing what to expect", d: "S", mb: { k: "SN", v: "S" } },
      { t: "Doing things properly, quality, getting details right", d: "C", mb: { k: "SN", v: "N" } },
    ],
  },
  {
    ph: "discover",
    tip: "How they ended up in their career = how they make big life decisions.",
    ask: "How did you end up in your current job? Was it planned or just happened?",
    opts: [
      { t: "Deliberately chose it, switched industries - intentional", d: "D", mb: { k: "SN", v: "N" } },
      { t: "Fell into it through people and connections", d: "I", mb: { k: "SN", v: "N" } },
      { t: "Comfortable, grew into it, not shaking things up", d: "S", mb: { k: "SN", v: "S" } },
      { t: "Researched, compared options, made a logical choice", d: "C", mb: { k: "SN", v: "S" } },
    ],
  },
  {
    ph: "discover",
    tip: "Real passion reveals personality more honestly than any direct question.",
    ask: "Outside work, what do you actually enjoy? What will you always make time for?",
    opts: [
      { t: "Social - gatherings, events, meeting new people", d: "I", mb: { k: "EI", v: "E" } },
      { t: "Family time, quiet hobbies, community stuff", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Achievement hobbies - sports, competition, building things", d: "D", mb: { k: "TF", v: "T" } },
      { t: "Investing, tech, learning, researching", d: "C", mb: { k: "SN", v: "N" } },
    ],
  },
  {
    ph: "discover",
    tip: "Planner vs spontaneous = Judging vs Perceiving. Critical for structuring your proposal.",
    ask: "You the type who plans everything or more just go with the flow?",
    opts: [
      { t: "Plan everything - itinerary, budget, calendar sorted", d: "C", mb: { k: "JP", v: "J" } },
      { t: "Spontaneous - boring to over-plan, see how first", d: "D", mb: { k: "JP", v: "P" } },
      { t: "Some planning but flexible, not too rigid", d: "S", mb: { k: "JP", v: "J" } },
      { t: "Depends, but I like knowing what is ahead", d: "I", mb: { k: "JP", v: "P" } },
    ],
  },
  {
    ph: "discover",
    tip: "Their real money worry = your emotional anchor for the whole conversation.",
    ask: "If you honest with me - what is the one money thing at the back of your mind?",
    opts: [
      { t: "Income protection - what if something happens to me", d: "S", mb: { k: "TF", v: "F" } },
      { t: "Not growing fast enough, missing good opportunities", d: "D", mb: { k: "SN", v: "N" } },
      { t: "Specific gap - numbers feel off, coverage not right", d: "C", mb: { k: "TF", v: "T" } },
      { t: "General anxiety - do not know where to start, feel behind", d: "I", mb: { k: "TF", v: "F" } },
    ],
  },
];
