/**
 * Discovery-phase content — verbatim port of prototype v6's `DISC_Q`,
 * `TRACK_COPY`, `pitSteer` and `WORRY` (2026-09-25).
 *
 * The four axes are asked on the discovery screen, AFTER the pit stop, each
 * worded for the provisional DISC letter the rapport + observations produced
 * (`frames[voice]`). The answers are NOT scored — they are four extra reads
 * the report steers by. The axis emoji v6 carried are dropped, like every
 * other emoji in /profiler.
 */

import type { DiscLetter, DiscoveryAxis, TrackKey, TrackValue } from '../../types';

export const TRACK_KEYS: readonly TrackKey[] = ['temperament', 'openness', 'horizon', 'decision'];

export const DISCOVERY_AXES: Record<TrackKey, DiscoveryAxis> = {
  temperament: {
    key: 'temperament',
    axis: 'Financial Temperament',
    left: 'Anxious',
    right: 'Calm',
    tip: 'How much reassurance they need. Watch the body too — words may follow the safe script.',
    frames: {
      D: 'Bottom line — you want your money safe and steady, or pushing for the bigger number even if it swings?',
      I: 'When it comes to your money — you more the chill let-it-grow type, or you like watching it move and do its thing?',
      S: "For your family's money — more important it stays safe and steady, or that it is working a bit harder for the future?",
      C: 'On the risk side — do you prefer capital preservation even at lower returns, or comfortable with some volatility for more growth?',
    },
    opts: [
      { t: "Safe and steady — I don't like seeing it drop", v: 'Anxious' },
      { t: 'Working hard — some movement is fine if it grows', v: 'Calm' },
    ],
  },
  openness: {
    key: 'openness',
    axis: 'Openness to Ideas',
    left: 'Familiar',
    right: 'Curious',
    tip: 'How much complexity they can hold. Curious can take layered structures; Familiar needs one clean idea.',
    frames: {
      D: 'You want me to just give you the best option straight, or you like seeing the clever angles others miss?',
      I: 'You the type who likes the simple proven thing, or you get a kick out of something new and different?',
      S: 'Do you feel more comfortable with something simple and familiar, or open to a newer approach if it fits?',
      C: 'Do you prefer a straightforward proven structure, or do you like exploring more sophisticated options in detail?',
    },
    opts: [
      { t: 'Simple and familiar — I trust what I understand', v: 'Familiar' },
      { t: 'Clever and new — I like learning a better way', v: 'Curious' },
    ],
  },
  horizon: {
    key: 'horizon',
    axis: 'Time Horizon',
    left: 'Present',
    right: 'Future',
    tip: 'Steers protect-now vs accumulate-for-later. Present-focused need the near-term win first.',
    frames: {
      D: 'You focused on what your money does for you now, or playing the long game — 10, 20 years out?',
      I: 'You more about enjoying life now, or already dreaming about the future you?',
      S: "When you think about money — more about taking care of things now, or building for the family's future?",
      C: 'Is your priority more near-term needs, or long-term planning over the next couple of decades?',
    },
    opts: [
      { t: 'Now — what it does for me today matters most', v: 'Present' },
      { t: "The long game — I'm planning years ahead", v: 'Future' },
    ],
  },
  decision: {
    key: 'decision',
    axis: 'Decision Style',
    left: 'Deliberate',
    right: 'Decisive',
    tip: 'Drives your follow-up timing. Deliberate needs space and a second meeting; Decisive can close at the table.',
    frames: {
      D: 'When something makes sense to you — you decide on the spot, or you still like to sit on it first?',
      I: 'You the type who goes with your gut there and then, or you like to talk it over with people first?',
      S: 'Do you usually like to take it home and think it through, or are you comfortable deciding once it feels right?',
      C: 'Do you prefer time to review everything thoroughly before deciding, or decide once the numbers add up?',
    },
    opts: [
      { t: 'I like to take my time, think it through', v: 'Deliberate' },
      { t: 'If it makes sense, I decide there and then', v: 'Decisive' },
    ],
  },
};

/** Per-pole "so what" steer (`so`) + a ready follow-up message (`msg`). */
export const TRACK_COPY: Record<TrackValue, { so: string; msg: string }> = {
  Anxious: {
    so: "Lead with certainty and protection. Show the floor before the ceiling. Go easy on 'returns' and 'upside' early — reassure with evidence, not optimism.",
    msg: "No rush at all — I just want to make sure you and the family are properly covered, no matter what. Whenever you're ready.",
  },
  Calm: {
    so: "Don't over-reassure — it reads as patronising. Give the data, the trade-offs, and treat them as capable of handling risk.",
    msg: "Had a thought on the structure we discussed — there's a cleaner way to get the same outcome. Worth 20 minutes?",
  },
  Familiar: {
    so: 'One clean idea at a time. Anchor to what people like them already do. Complexity loses them — simplicity closes them.',
    msg: 'Kept it simple like you wanted — one clear plan, nothing fancy. Shall I walk you through it?',
  },
  Curious: {
    so: "Bring the layered structures and the 'here's a different way to think about it.' They want to be engaged, not handled.",
    msg: "Found an angle I didn't cover last time — think you'll find it interesting. Free this week?",
  },
  Present: {
    so: 'Lead with the near-term win — what this does for them now. Future benefits land better once the present need is met.',
    msg: 'Thinking about what works for you right now — got something that fits your current situation. Quick chat?',
  },
  Future: {
    so: 'They feel the long game already. Lead with the 10-20 year picture — retirement, kids, legacy. Accumulation framing works.',
    msg: 'Mapped out how this looks over the next 10-20 years for you — quite a clear picture. Want to see it?',
  },
  Deliberate: {
    so: "Don't push for a close today. Give them space and material to review. Set the next meeting before you part. The 2nd appointment is where it happens.",
    msg: "No pressure at all — take your time to think it over. I'll prepare everything so it's clear when you're ready.",
  },
  Decisive: {
    so: "They can decide at the table — so make sure you can present and close in the same sitting. Have the paperwork ready. Don't make them wait and cool off.",
    msg: "I've got everything ready to go — if it makes sense when you see it, we can sort it out the same day. When works?",
  },
};

/** Pit stop: how to steer the money talk for the provisional DISC letter. */
export const PIT_STEER: Record<DiscLetter, readonly string[]> = {
  D: ['Get to the point fast — they want outcome, not story.', 'Lead with results and the bottom line.', 'Give them control of the decision — do not push.'],
  I: ['Keep it warm and conversational — let them talk.', 'Use stories and people, not spreadsheets.', 'Match their energy — do not go cold and technical.'],
  S: ['Slow down, no pressure — build the comfort.', 'Anchor everything to family and security.', 'Reassure — they need to feel safe before they move.'],
  C: ['Slow down. Do not pitch — explain. Let them ask.', 'Lead with facts and structure, not stories.', 'Do not push for a decision today — they need to mull.'],
};

/** Pit stop: the four reads the discovery screen is about to take. */
export const PIT_PREVIEW: readonly string[] = [
  'How safe vs how hard their money works',
  'Simple and familiar vs clever and new',
  'Focused on now vs the long game',
  'Decides on the spot vs needs to think',
];

/**
 * The money anchor's answer, echoed back in their own terms — keyed by the
 * DISC letter of the Q7 option they picked (one option per letter).
 */
export const MONEY_WORRY: Record<DiscLetter, { echo: string; short: string }> = {
  S: { echo: 'making sure the family is okay if anything happens to you', short: 'the family being okay if anything happens' },
  D: { echo: 'not wanting to miss chances while your money sits still', short: 'not missing the window' },
  C: { echo: 'knowing the right amount to start with', short: 'knowing the right amount to start' },
  I: { echo: 'not really knowing where to start with all this', short: 'not knowing where to start' },
};
