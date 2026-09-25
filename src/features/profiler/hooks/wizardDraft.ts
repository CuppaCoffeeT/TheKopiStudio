/**
 * wizardDraft — sessionStorage persistence for the in-flow wizard (PRD-sanctioned
 * addition vs legacy: a refresh restores mid-flow progress). Split out of
 * `useWizardState` when the v6 port (2026-09-25) pushed that file past the
 * 200-LOC ceiling.
 *
 * KEY BUMPED for v6 (`-v6` suffix). A pre-v6 draft holds option indexes from
 * the (17) question order and a step numbering without the pit stop and
 * discovery screens; restoring it would highlight options the prospect never
 * picked. Drafts are per-tab and short-lived, so dropping them is the whole
 * migration — the old key is cleared on read.
 */

import { QS } from '../lib/content';
import type { DiscoveryTracks, RawAnswer } from '../types';

export interface IntakeInfo {
  adv: string;
  name: string;
  age: string;
  meeting: string;
  occ: string;
}

export interface WizardDraft {
  screen: number;
  intake: IntakeInfo;
  answers: (RawAnswer | null)[];
  nv: Record<string, boolean>;
  tracks: Partial<DiscoveryTracks>;
  notes: string;
}

const DRAFT_KEY = 'profiler-wizard-draft-v6';
const PRE_V6_DRAFT_KEY = 'profiler-wizard-draft';

export function readDraft(totalSteps: number): WizardDraft | null {
  try {
    sessionStorage.removeItem(PRE_V6_DRAFT_KEY);
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as WizardDraft;
    const valid =
      typeof draft.screen === 'number' &&
      draft.screen >= 1 &&
      draft.screen <= totalSteps &&
      Array.isArray(draft.answers) &&
      draft.answers.length === QS.length &&
      typeof draft.intake === 'object' &&
      draft.intake !== null;
    return valid ? { ...draft, tracks: draft.tracks ?? {} } : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: WizardDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable — draft persistence is best-effort */
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable — draft persistence is best-effort */
  }
}
