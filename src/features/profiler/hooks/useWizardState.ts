/**
 * useWizardState — the public profiling wizard's flow state machine.
 *
 * Screen numbering is the legacy port (`profiler.js`): 0 intake → 1–2 question
 * batches (Q 0–3 / 4–7) → 3–7 the five NV observation groups → 'R' result.
 * `TOTAL_STEPS` = 7 (2 question screens + 5 observation screens).
 *
 * NEW vs legacy (PRD-sanctioned): the in-flow state (screens 1–7) persists to
 * sessionStorage so a refresh restores mid-flow progress. The draft clears on
 * generate and on explicit exit. Observation toggles mirror legacy `tgNV`:
 * an id ticked then unticked stays in the map as `false`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QS, NVG } from '../lib/content';
import { calcProfile, type ProfileResult } from '../lib/scoring';
import type { RawAnswer } from '../types';

export const TOTAL_STEPS = 2 + NVG.length;

export type WizardScreen = number | 'R';

/** Raw intake field values; defaults are applied via {@link effectiveIntake}. */
export interface IntakeInfo {
  adv: string;
  name: string;
  age: string;
  meeting: string;
  occ: string;
}

export const EMPTY_INTAKE: IntakeInfo = { adv: '', name: '', age: '', meeting: '1', occ: '' };

/** Legacy `startForm` defaults: blank names become "Advisor"/"Prospect". */
export function effectiveIntake(intake: IntakeInfo): IntakeInfo {
  return {
    ...intake,
    adv: intake.adv.trim() || 'Advisor',
    name: intake.name.trim() || 'Prospect',
    occ: intake.occ.trim(),
  };
}

/** Ids ticked TRUE only — the scoring/`observations_count` input. */
export function tickedIds(nv: Record<string, boolean>): string[] {
  return Object.keys(nv).filter((id) => nv[id]);
}

interface WizardDraft {
  screen: number;
  intake: IntakeInfo;
  answers: (RawAnswer | null)[];
  nv: Record<string, boolean>;
  notes: string;
}

const DRAFT_KEY = 'profiler-wizard-draft';

function readDraft(): WizardDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as WizardDraft;
    const valid =
      typeof draft.screen === 'number' &&
      draft.screen >= 1 &&
      draft.screen <= TOTAL_STEPS &&
      Array.isArray(draft.answers) &&
      draft.answers.length === QS.length &&
      typeof draft.intake === 'object' &&
      draft.intake !== null;
    return valid ? draft : null;
  } catch {
    return null;
  }
}

function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable — draft persistence is best-effort */
  }
}

export function useWizardState() {
  const [draft] = useState(readDraft);
  const [screen, setScreen] = useState<WizardScreen>(draft?.screen ?? 0);
  const [intake, setIntake] = useState<IntakeInfo>(draft?.intake ?? EMPTY_INTAKE);
  const [answers, setAnswers] = useState<(RawAnswer | null)[]>(
    draft?.answers ?? new Array<RawAnswer | null>(QS.length).fill(null),
  );
  const [nv, setNv] = useState<Record<string, boolean>>(draft?.nv ?? {});
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [profile, setProfile] = useState<ProfileResult | null>(null);

  // Draft persistence — mid-flow only (intake and result screens carry no draft).
  useEffect(() => {
    if (typeof screen !== 'number' || screen < 1) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ screen, intake, answers, nv, notes }));
    } catch {
      /* storage unavailable — draft persistence is best-effort */
    }
  }, [screen, intake, answers, nv, notes]);

  // Legacy `go()` scrolled to top on every screen change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const start = useCallback(() => setScreen(1), []);

  const selectOption = useCallback((qi: number, oi: number) => {
    const opt = QS[qi].opts[oi];
    setAnswers((prev) => prev.map((a, i) => (i === qi ? { oi, d: opt.d, mb: opt.mb } : a)));
  }, []);

  /** Legacy `tgNV`: untoggled ids persist as `false` in the map. */
  const toggleObservation = useCallback((id: string) => {
    setNv((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const next = useCallback(() => {
    setScreen((s) => (typeof s === 'number' ? Math.min(s + 1, TOTAL_STEPS) : s));
  }, []);

  const back = useCallback(() => {
    setScreen((s) => (typeof s === 'number' ? Math.max(s - 1, 1) : s));
  }, []);

  /** Compute the profile, move to the result screen, clear the draft. */
  const generate = useCallback((): ProfileResult => {
    const pf = calcProfile(answers, tickedIds(nv), effectiveIntake(intake).occ);
    setProfile(pf);
    setScreen('R');
    clearDraft();
    return pf;
  }, [answers, nv, intake]);

  /** Explicit exit mid-flow: discard progress, keep intake fields (legacy `go(0)`). */
  const exitToIntake = useCallback(() => {
    setAnswers(new Array<RawAnswer | null>(QS.length).fill(null));
    setNv({});
    setNotes('');
    setProfile(null);
    setScreen(0);
    clearDraft();
  }, []);

  /** Legacy `resetAll` ("Profile Another Prospect"): clears intake too. */
  const resetAll = useCallback(() => {
    setIntake(EMPTY_INTAKE);
    setAnswers(new Array<RawAnswer | null>(QS.length).fill(null));
    setNv({});
    setNotes('');
    setProfile(null);
    setScreen(0);
    clearDraft();
  }, []);

  const isMidFlow = useMemo(
    () => answers.some(Boolean) || Object.values(nv).some(Boolean),
    [answers, nv],
  );

  const isBatchComplete = useCallback(
    (batch: readonly number[]) => batch.every((i) => answers[i] !== null),
    [answers],
  );

  return {
    screen,
    intake,
    setIntake,
    answers,
    nv,
    notes,
    setNotes,
    profile,
    start,
    selectOption,
    toggleObservation,
    next,
    back,
    generate,
    exitToIntake,
    resetAll,
    isMidFlow,
    isBatchComplete,
  };
}
