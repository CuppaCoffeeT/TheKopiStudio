/**
 * useWizardController — orchestration layer for ProfilerWizardPage.
 *
 * Wraps useWizardState + useSaveResult and owns the page-level handlers
 * (generate-with-save, back/exit confirm, reset, PDF/CSV export) plus the
 * derived view state (subtitle, inFlow, nextDisabled) so the page itself is
 * pure composition. Mechanical extraction from the page — no behavior change.
 *
 * PRD-sanctioned additions live here: the duplicate-save guard (same inputs
 * ⇒ regenerate doesn't insert again) and the advisor prefill from the
 * logged-in profile (legacy homeHTML behaviour).
 */

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalDateString } from '@/utils/timezoneUtils';
import { showSuccess } from '@/utils/toastHelper';
import { buildCsv, downloadCsv } from '../lib/export';
import { effectiveIntake, TOTAL_STEPS, useWizardState } from './useWizardState';
import { buildResultInsert, saveSignature } from './savePayload';
import { useSaveResult } from './useSaveResult';
import type { SaveState } from '../components/wizard/result/ResultActions';

export const QUESTION_BATCHES: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
];

export function useWizardController() {
  const { user, profile: authProfile } = useAuth();
  const wizard = useWizardState();
  const save = useSaveResult();

  const [saveState, setSaveState] = useState<SaveState>('saving');
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const lastSavedSignature = useRef<string | null>(null);
  const advisorPrefilled = useRef(false);

  // Legacy homeHTML prefilled the advisor field from the logged-in profile.
  useEffect(() => {
    if (advisorPrefilled.current || !authProfile?.name) return;
    advisorPrefilled.current = true;
    if (!wizard.intake.adv) wizard.setIntake({ ...wizard.intake, adv: authProfile.name });
  }, [authProfile, wizard]);

  const { screen } = wizard;
  const info = effectiveIntake(wizard.intake);
  const inFlow = typeof screen === 'number' && screen >= 1;

  const subtitle =
    screen === 'R'
      ? `${info.name} · Profile Ready`
      : inFlow
        ? `Profiling ${info.name}`
        : 'DISC × MBTI · Auto-Profile';

  const handleGenerate = () => {
    const generated = wizard.generate();
    const signature = saveSignature(wizard.intake, wizard.answers, wizard.nv);
    if (lastSavedSignature.current === signature) {
      // Duplicate-save guard: same inputs already saved — stay in saved state.
      setSaveState('skipped');
      return;
    }
    setSaveState('saving');
    const payload = buildResultInsert({
      intake: wizard.intake,
      answers: wizard.answers,
      nv: wizard.nv,
      profile: generated,
      notes: wizard.notes,
      userId: user?.id ?? null,
    });
    save.mutate(payload, {
      onSuccess: () => {
        lastSavedSignature.current = signature;
        setSaveState('saved');
      },
      onError: () => setSaveState('error'),
    });
  };

  const handleNext = () => {
    if (screen === TOTAL_STEPS) handleGenerate();
    else wizard.next();
  };

  const handleBack = () => {
    if (screen === 1) {
      if (wizard.isMidFlow) setExitConfirmOpen(true);
      else wizard.exitToIntake();
    } else {
      wizard.back();
    }
  };

  const confirmExit = () => {
    setExitConfirmOpen(false);
    lastSavedSignature.current = null;
    wizard.exitToIntake();
  };

  const handleReset = () => {
    lastSavedSignature.current = null;
    wizard.resetAll();
  };

  const handlePdf = () => window.print();

  const handleCsv = () => {
    if (!wizard.profile) return;
    const date = getLocalDateString(new Date());
    const csv = buildCsv({
      date,
      advisor: info.adv,
      prospect: info.name,
      age: info.age,
      occupation: info.occ,
      meeting: info.meeting,
      discPrimary: wizard.profile.pri,
      discSecondary: wizard.profile.sec,
      mbti: wizard.profile.mbs,
      scoreD: wizard.profile.dc.D,
      scoreI: wizard.profile.dc.I,
      scoreS: wizard.profile.dc.S,
      scoreC: wizard.profile.dc.C,
      questions: wizard.profile.qCount,
      observations: wizard.profile.nvCount,
      notes: wizard.notes,
    });
    downloadCsv(`profile_${info.name.replace(/\s+/g, '_')}_${date}.csv`, csv);
    showSuccess('CSV saved');
  };

  const isQuestionScreen = screen === 1 || screen === 2;
  const nextDisabled =
    isQuestionScreen && !wizard.isBatchComplete(QUESTION_BATCHES[(screen as number) - 1]);

  return {
    user,
    wizard,
    info,
    screen,
    inFlow,
    isQuestionScreen,
    subtitle,
    nextDisabled,
    saveState,
    exitConfirmOpen,
    setExitConfirmOpen,
    handleNext,
    handleBack,
    confirmExit,
    handleReset,
    handlePdf,
    handleCsv,
  };
}
