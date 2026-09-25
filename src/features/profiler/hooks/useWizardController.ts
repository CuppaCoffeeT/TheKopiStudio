/**
 * useWizardController — orchestration layer for ProfilerWizardPage.
 *
 * Wraps useWizardState + useSaveResult and owns the page-level handlers
 * (generate-with-save, back/exit confirm, reset, PDF/CSV export) plus the
 * derived view state (subtitle, inFlow, nextDisabled, progress hint, the pit
 * stop's interim read) so the page itself is pure composition.
 *
 * PRD-sanctioned additions live here: the duplicate-save guard (same inputs
 * ⇒ regenerate doesn't insert again) and the advisor prefill from the
 * logged-in profile (legacy homeHTML behaviour).
 *
 * The CRM ENTRY CONTRACT (`?prospect=` + `?customerId=`) moved to
 * `useCustomerLink` on 2026-08-19, which both READS it (arriving from the CRM)
 * and WRITES it (the intake screen's picker). It is composed here rather than
 * in the page because the save payload — the one thing that consumes
 * `customerId` — is assembled here.
 *
 * v6 (2026-09-25): the flow gained the pit stop + discovery screens. The
 * interim read is DERIVED from state rather than snapshotted on entering the
 * pit stop as v6 did — equivalent, because only rapport answers and
 * observations feed it and neither can change on the pit stop or discovery.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { downloadWizardCsv } from '../lib/export';
import { MONEY_ANCHOR_QI, RAPPORT_BATCHES } from '../lib/content';
import { answeredTrackCount, calcInterim, isDiscoveryTracks, withTracks } from '../lib/discovery';
import {
  DISCOVERY_STEP,
  effectiveIntake,
  FIRST_OBSERVATION_STEP,
  PITSTOP_STEP,
  tickedIds,
  useWizardState,
} from './useWizardState';
import { buildResultInsert, saveSignature } from './savePayload';
import { useSaveResult } from './useSaveResult';
import { useCustomerLink } from './useCustomerLink';
import type { SaveState } from '../components/wizard/result/ResultActions';

/** Items to answer on the discovery screen: the money anchor + four tracks. */
const DISCOVERY_ITEMS = 5;

function phaseLabel(screen: number): string {
  if (screen < FIRST_OBSERVATION_STEP) return 'Rapport';
  if (screen < PITSTOP_STEP) return 'Body Language';
  return screen === PITSTOP_STEP ? 'Pit Stop' : 'Discovery';
}

export function useWizardController() {
  const { user, profile: authProfile } = useAuth();
  const wizard = useWizardState();
  const save = useSaveResult();
  const { customerId, chooseCustomer } = useCustomerLink({
    intake: wizard.intake,
    setIntake: wizard.setIntake,
  });

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

  const { screen, answers, nv, tracks } = wizard;
  const info = effectiveIntake(wizard.intake);
  const inFlow = typeof screen === 'number' && screen >= 1;
  const isQuestionScreen = screen === 1 || screen === 2;
  const isDiscovery = screen === DISCOVERY_STEP;

  const interim = useMemo(() => calcInterim(answers, tickedIds(nv), info.occ), [answers, nv, info.occ]);
  const completeTracks = isDiscoveryTracks(tracks) ? tracks : null;

  const subtitle =
    screen === 'R'
      ? `${info.name} · Profile Ready`
      : inFlow
        ? `${phaseLabel(screen)} · ${info.name}`
        : 'Read any prospect in one meeting';

  const handleGenerate = () => {
    const generated = wizard.generate();
    const savedAnswers = withTracks(answers, tracks);
    const signature = saveSignature(wizard.intake, savedAnswers, nv);
    if (lastSavedSignature.current === signature) {
      // Duplicate-save guard: same inputs already saved — stay in saved state.
      setSaveState('skipped');
      return;
    }
    setSaveState('saving');
    const payload = buildResultInsert({
      intake: wizard.intake,
      answers: savedAnswers,
      nv,
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
    if (isDiscovery) handleGenerate();
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
    downloadWizardCsv({ info, profile: wizard.profile, tracks: completeTracks, notes: wizard.notes });
  };

  // Live "{n} of {total} answered" for the gated screens (null elsewhere).
  //
  // `!== null`, NOT `!== undefined` (fixed 2026-08-19). `useWizardState` seeds
  // `answers` with `new Array(8).fill(null)`, so every slot is defined from the
  // first render and the old test counted all four before a single option was
  // picked: the bar read "All 4 answered" beside a disabled Next.
  const progressHint = isQuestionScreen
    ? {
        answered: RAPPORT_BATCHES[screen - 1].filter((qi) => answers[qi] !== null).length,
        total: RAPPORT_BATCHES[screen - 1].length,
      }
    : isDiscovery
      ? {
          answered: (answers[MONEY_ANCHOR_QI] !== null ? 1 : 0) + answeredTrackCount(tracks),
          total: DISCOVERY_ITEMS,
        }
      : null;
  const nextDisabled = progressHint !== null && progressHint.answered < progressHint.total;

  return {
    user,
    wizard,
    info,
    screen,
    inFlow,
    interim,
    completeTracks,
    customerId,
    chooseCustomer,
    subtitle,
    nextDisabled,
    progressHint,
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
