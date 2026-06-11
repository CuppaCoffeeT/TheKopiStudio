/**
 * The 4 DISC profile content blocks, re-assembled from the per-pair files
 * (`./profiles-di`, `./profiles-sc`) into the legacy `PR` record shape.
 *
 * PARITY CONTRACT: key order D/I/S/C is frozen — see ./profiles-di.ts header.
 */

import type { DiscLetter, DiscProfile } from '../../types';
import { PROFILE_D, PROFILE_I } from './profiles-di';
import { PROFILE_S, PROFILE_C } from './profiles-sc';

/** The 4 DISC profile content blocks, keyed by primary letter. */
export const PR: Record<DiscLetter, DiscProfile> = {
  D: PROFILE_D,
  I: PROFILE_I,
  S: PROFILE_S,
  C: PROFILE_C,
};
