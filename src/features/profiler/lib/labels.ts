/**
 * Profiler display labels — intake option sets and report label maps ported
 * from the legacy app (`public/js/pages/home.js`). Shared by the wizard (P3)
 * and the results detail reconstruction (P4).
 *
 * Values are part of the legacy data contract: `age_range` and `meeting` are
 * persisted verbatim in `public.results` — do not edit.
 */

import type { MbtiPole } from '../types';

/** Age-range options exactly as the legacy intake select offered them. */
export const AGE_RANGES: readonly string[] = ['20-25', '26-30', '31-35', '36-40', '41-45', '46+'];

/**
 * Meeting select options — value is stored as text '1'–'4' (legacy parity).
 * Report-side meeting labels live in `lib/meeting.ts`.
 */
export const MEETING_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '1', label: '1st - Opening' },
  { value: '2', label: '2nd - Presentation' },
  { value: '3', label: '3rd - Closing' },
  { value: '4', label: 'Servicing' },
];

/** One MBTI dimension as the report renders it (legacy `dims` array order). */
export interface MbtiDimensionDef {
  /** First-pole label (the `>=` tie winner side). */
  la: string;
  /** Second-pole label. */
  lb: string;
  /** First pole key into `MbtiSignals`. */
  a: MbtiPole;
  /** Second pole key into `MbtiSignals`. */
  b: MbtiPole;
}

/** Display order E/I, S/N, T/F, J/P — winner is `a` when scores tie. */
export const MBTI_DIMENSIONS: readonly MbtiDimensionDef[] = [
  { la: 'Extravert', lb: 'Introvert', a: 'E', b: 'I' },
  { la: 'Sensing', lb: 'iNtuitive', a: 'S', b: 'N' },
  { la: 'Thinking', lb: 'Feeling', a: 'T', b: 'F' },
  { la: 'Judging', lb: 'Perceiving', a: 'J', b: 'P' },
];
