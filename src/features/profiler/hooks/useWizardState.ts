/**
 * useWizardState — the public profiling wizard's flow state machine.
 *
 * Screen numbering follows prototype v6's `go()` (ported 2026-09-25):
 * 0 intake → 1–2 RAPPORT batches (Q0–3 / Q4–6) → 3–7 the five NV observation
 * groups → 8 PIT STOP (provisional DISC read) → 9 DISCOVERY (the money anchor
 * Q7 + four tracks) → 'R' result. `TOTAL_STEPS` = 9, matching v6's
 * "Step n of 9". Before v6 it was 7: two 4-question screens + observations.
 *
 * NEW vs legacy (PRD-sanctioned): the in-flow state (screens 1–9) persists to
 * sessionStorage (`wizardDraft`) so a refresh restores mid-flow progress. The
 * draft clears on generate and on explicit exit. Observation toggles mirror
 * legacy `tgNV`: an id ticked then unticked stays in the map as `false`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QS, NVG } from '../lib/content';
import { calcProfile, type ProfileResult } from '../lib/scoring';
import type { DiscoveryTracks, RawAnswer, TrackKey } from '../types';
import { clearDraft, readDraft, writeDraft, type IntakeInfo } from './wizardDraft';

export type { IntakeInfo } from './wizardDraft';

/** First observation screen; observation group `g` is screen `3 + g`. */
export const FIRST_OBSERVATION_STEP = 3;
export const PITSTOP_STEP = FIRST_OBSERVATION_STEP + NVG.length;
export const DISCOVERY_STEP = PITSTOP_STEP + 1;
export const TOTAL_STEPS = DISCOVERY_STEP;

export type WizardScreen = number | 'R';

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

const emptyAnswers = () => new Array<RawAnswer | null>(QS.length).fill(null);

export function useWizardState() {
  const [draft] = useState(() => readDraft(TOTAL_STEPS));
  const [screen, setScreen] = useState<WizardScreen>(draft?.screen ?? 0);
  const [intake, setIntake] = useState<IntakeInfo>(draft?.intake ?? EMPTY_INTAKE);
  const [answers, setAnswers] = useState<(RawAnswer | null)[]>(draft?.answers ?? emptyAnswers());
  const [nv, setNv] = useState<Record<string, boolean>>(draft?.nv ?? {});
  const [tracks, setTracks] = useState<Partial<DiscoveryTracks>>(draft?.tracks ?? {});
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [profile, setProfile] = useState<ProfileResult | null>(null);

  // Draft persistence — mid-flow only (intake and result screens carry no draft).
  useEffect(() => {
    if (typeof screen !== 'number' || screen < 1) return;
    writeDraft({ screen, intake, answers, nv, tracks, notes });
  }, [screen, intake, answers, nv, tracks, notes]);

  // Legacy `go()` scrolled to top on every screen change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const start = useCallback(() => setScreen(1), []);

  const selectOption = useCallback((qi: number, oi: number) => {
    const opt = QS[qi].opts[oi];
    setAnswers((prev) => prev.map((a, i) => (i === qi ? { oi, d: opt.d, mb: opt.mb } : a)));
  }, []);

  /** v6 `selDisc`: one pole per discovery track. */
  const selectTrack = useCallback(<K extends TrackKey>(key: K, value: DiscoveryTracks[K]) => {
    setTracks((prev) => ({ ...prev, [key]: value }));
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

  const clearProgress = useCallback(() => {
    setAnswers(emptyAnswers());
    setNv({});
    setTracks({});
    setNotes('');
    setProfile(null);
    setScreen(0);
    clearDraft();
  }, []);

  /** Explicit exit mid-flow: discard progress, keep intake fields (legacy `go(0)`). */
  const exitToIntake = clearProgress;

  /** Legacy `resetAll` ("Profile Another Prospect"): clears intake too. */
  const resetAll = useCallback(() => {
    setIntake(EMPTY_INTAKE);
    clearProgress();
  }, [clearProgress]);

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
    tracks,
    notes,
    setNotes,
    profile,
    start,
    selectOption,
    selectTrack,
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
