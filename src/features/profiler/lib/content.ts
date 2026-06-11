/**
 * Profiler content — verbatim port of the legacy app's `public/js/data.js`,
 * decomposed into `./content/*` data files. This barrel preserves the original
 * import surface (`QS` / `NVG` / `PR`).
 *
 * PARITY CONTRACT (do not edit copy without a versioning decision — see PRD):
 * - Array orders and option order within each question are FROZEN: the option
 *   index (`oi`) and NvItem ids are persisted in `public.results` rows.
 * - HTML entities / — escapes from the legacy source are converted to
 *   literal unicode (emoji and em-dashes are literal characters).
 * - The `op` opening lines keep their embedded double quotes — part of the copy.
 * - `msgs` key order is engage/appt/followup/objections/close with
 *   5/5/5/6/5 items per profile (26 statements x 4 profiles).
 */

export { QS } from './content/questions';
export { NVG } from './content/observations';
export { PR } from './content/profiles';
