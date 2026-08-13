/**
 * buildResultInsert — pure builder for the `public.results` insert payload.
 *
 * Shape is the FROZEN legacy contract (`home.js` `saveToDb`): meeting stays
 * text '1'–'4', `raw_answers` is the 8-slot `{d, mb:{k,v}, oi}` array as-is,
 * `nv_observations` keeps FALSE entries (ids ticked then unticked persist),
 * while `observations_count` counts TRUE only (scoring already did). Blank
 * age/occupation/meeting become NULL exactly as legacy `|| null` did.
 *
 * The ONE addition to that frozen shape is `client_id` — set when the wizard
 * was entered from a customer (`?customerId=`). Before this, the column was
 * only ever written by "Convert to client" AFTER the fact, so profiling a
 * customer who already had a record left them reading as "never profiled"
 * forever (the Overview queue's profiled test is `results.client_id`, never
 * a name match).
 *
 * Kept IO-free (separate from useSaveResult) so the payload parity unit test
 * runs without the supabase client.
 */

import type { Json } from '@/integrations/supabase/types';
import type { ProfileResult } from '../lib/scoring';
import type { ProfilerResultInsert, RawAnswer } from '../types';
import { effectiveIntake, type IntakeInfo } from './useWizardState';

export interface BuildResultInsertArgs {
  /** Raw intake values — name defaults are applied here, like legacy `startForm`. */
  intake: IntakeInfo;
  answers: ReadonlyArray<RawAnswer | null>;
  /** Full observation map INCLUDING false entries. */
  nv: Record<string, boolean>;
  profile: ProfileResult;
  notes: string;
  /** Authenticated user id, or null for the anonymous fire-and-forget save. */
  userId: string | null;
  /**
   * The customer this profile was started FOR (`?customerId=`), already
   * resolved as linkable by the caller. Null for a cold-start profile — a
   * prospect nobody has a customer record for yet, which is still the
   * wizard's primary use.
   */
  clientId?: string | null;
}

export function buildResultInsert({
  intake,
  answers,
  nv,
  profile,
  notes,
  userId,
  clientId = null,
}: BuildResultInsertArgs): ProfilerResultInsert {
  const info = effectiveIntake(intake);
  return {
    user_id: userId,
    client_id: clientId,
    advisor_name: info.adv,
    prospect_name: info.name,
    age_range: info.age || null,
    occupation: info.occ || null,
    meeting: info.meeting || null,
    disc_primary: profile.pri,
    disc_secondary: profile.sec,
    score_d: profile.dc.D,
    score_i: profile.dc.I,
    score_s: profile.dc.S,
    score_c: profile.dc.C,
    mbti: profile.mbs,
    questions_answered: profile.qCount,
    observations_count: profile.nvCount,
    raw_answers: answers as unknown as Json,
    nv_observations: nv as unknown as Json,
    notes,
  };
}

/**
 * Duplicate-save guard signature: same inputs ⇒ same signature ⇒ skip the
 * auto-save on regenerate. Notes are EXCLUDED — legacy saved once at
 * generation; notes edited afterwards never re-saved.
 */
export function saveSignature(
  intake: IntakeInfo,
  answers: ReadonlyArray<RawAnswer | null>,
  nv: Record<string, boolean>,
): string {
  return JSON.stringify({ intake: effectiveIntake(intake), answers, ticked: Object.keys(nv).filter((id) => nv[id]).sort() });
}
