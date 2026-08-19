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
 *
 * It also owns the CRM ENTRY CONTRACT — both query params a customer-shaped
 * entry point passes, kept in ONE place so the pair can't drift apart:
 *   ?prospect=<name>       seeds the intake name (a draft or typed name wins)
 *   ?customerId=<uuid>     links the saved result to that customer record
 * The id is the load-bearing half: the Overview queue decides "profiled" from
 * `results.client_id` alone, so a name-only entry produced a profile that
 * left the customer reading "never profiled" for good. Both are read here,
 * not in the page, because the save payload is assembled here.
 *
 * Since 2026-08-19 the same pair is also WRITTEN here, by `chooseCustomer` —
 * the intake screen's `ToolCustomerBar` (tool-shell alignment, decisions.md).
 * Arriving from the CRM and picking from the bar now produce the identical URL,
 * so there is one entry contract rather than one per doorway.
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [saveState, setSaveState] = useState<SaveState>('saving');
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const lastSavedSignature = useRef<string | null>(null);
  const advisorPrefilled = useRef(false);

  // The wizard never navigates, so the params survive a mid-flow refresh
  // alongside the sessionStorage draft — no need to mirror them into state.
  const customerId = searchParams.get('customerId');

  // Legacy homeHTML prefilled the advisor field from the logged-in profile.
  useEffect(() => {
    if (advisorPrefilled.current || !authProfile?.name) return;
    advisorPrefilled.current = true;
    if (!wizard.intake.adv) wizard.setIntake({ ...wizard.intake, adv: authProfile.name });
  }, [authProfile, wizard]);

  // Seed the prospect name once on arrival; a draft-restored or hand-typed
  // name always wins, so the seed only ever fills an empty field.
  useEffect(() => {
    const prospect = searchParams.get('prospect');
    if (prospect && !wizard.intake.name.trim()) {
      wizard.setIntake({ ...wizard.intake, name: prospect });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The intake screen's customer picker. Writes the SAME pair the CRM entry
   * link writes (`profilerEntry.profilerHrefFor`) so the two doorways cannot
   * drift: the id links the save, the name fills the field.
   *
   * Picking OVERWRITES a typed name — you chose a record, so the record wins.
   * Clearing does not: it drops the link and leaves the text alone, because
   * "not linked to a record" and "erase what I typed" are different intents,
   * and only one of them is what the Clear button offers.
   */
  const chooseCustomer = (next: { id: string; name: string } | null) => {
    const updated = new URLSearchParams(searchParams);
    if (next) {
      updated.set('customerId', next.id);
      updated.set('prospect', next.name);
      wizard.setIntake({ ...wizard.intake, name: next.name });
    } else {
      updated.delete('customerId');
      updated.delete('prospect');
    }
    // `replace: true` — picking a customer is not a place you navigate back to,
    // and the wizard's Back button already means "previous step".
    setSearchParams(updated, { replace: true });
  };

  const { screen } = wizard;
  const info = effectiveIntake(wizard.intake);
  const inFlow = typeof screen === 'number' && screen >= 1;

  const subtitle =
    screen === 'R'
      ? `${info.name} · Profile Ready`
      : inFlow
        ? `Profiling ${info.name}`
        : 'Read any prospect in one meeting';

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
      clientId: customerId,
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
    customerId,
    chooseCustomer,
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
