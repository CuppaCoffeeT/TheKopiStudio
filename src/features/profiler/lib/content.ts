/**
 * Profiler content — verbatim port of the legacy app's `public/js/data.js`,
 * decomposed into `./content/*` data files. This barrel preserves the original
 * import surface (`QS` / `NVG` / `PR`) plus prototype v6's discovery content.
 *
 * PARITY CONTRACT (do not edit copy without a versioning decision — see PRD):
 * - NvItem ids are persisted in `public.results` rows and are FROZEN.
 * - Every question keeps exactly one option per DISC letter with a fixed MBTI
 *   pole per (question, letter) — the identity a stored answer carries. The
 *   option ORDER changed once, in the v6 port (content/questions.ts header).
 * - HTML entities / — escapes from the legacy source are converted to
 *   literal unicode (emoji and em-dashes are literal characters).
 * - The `op` opening lines keep their embedded double quotes — part of the copy.
 * - `msgs` key order is engage/appt/followup/objections/close with
 *   5/5/5/6/5 items per profile (26 statements x 4 profiles).
 */

export { QS, RAPPORT_BATCHES, MONEY_ANCHOR_QI } from './content/questions';
export { NVG } from './content/observations';
export { PR } from './content/profiles';
export {
  DISCOVERY_AXES,
  MONEY_WORRY,
  PIT_PREVIEW,
  PIT_STEER,
  TRACK_COPY,
  TRACK_KEYS,
} from './content/discovery';
