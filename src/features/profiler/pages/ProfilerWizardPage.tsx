/**
 * ProfilerWizardPage — public DISC × MBTI profiling wizard (TOOL archetype).
 *
 * PUBLIC route (/profiler): no ProtectedRoute, no AppHeaderShell — anonymous
 * visitors run the full flow; the page renders its own minimal top bar.
 *
 * Faithful port of the legacy flow (`profiler.js` `go()`): intake → 2 question
 * screens (Next gated on all 4 answered) → 5 optional observation screens
 * (last button "Generate Profile →") → result report with auto-save.
 * Progress reads "Step n of 7" / round(n/7*100)%. Back from the first screen
 * exits to intake (confirm when mid-flow — explicit exit clears the
 * sessionStorage draft). PRD-sanctioned additions: draft persistence and the
 * duplicate-save guard (same inputs ⇒ regenerate doesn't insert again).
 *
 * All handlers/derived state live in useWizardController — this file is
 * composition only.
 */

import { SEO } from '@/components/primitives/shell/SEO';
import { Button } from '@/components/primitives/shell/Button';
import { Progress } from '@/components/primitives/form';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { meetingLabel } from '../lib/meeting';
import { TOTAL_STEPS } from '../hooks/useWizardState';
import { QUESTION_BATCHES, useWizardController } from '../hooks/useWizardController';
import { WizardTopBar } from '../components/wizard/WizardTopBar';
import { IntakeForm } from '../components/wizard/IntakeForm';
import { QuestionScreen } from '../components/wizard/QuestionScreen';
import { ObservationScreen } from '../components/wizard/ObservationScreen';
import { ResultReport } from '../components/wizard/result/ResultReport';
import '../lib/print.css';

export default function ProfilerWizardPage() {
  const c = useWizardController();
  const { wizard, info, screen, inFlow, isQuestionScreen } = c;

  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Prospect Profiler" description="Run a DISC × MBTI prospect profile" />
      <WizardTopBar subtitle={c.subtitle} isAuthenticated={Boolean(c.user)} />

      {inFlow && (
        <div className="print-hide sticky top-[53px] z-30 border-b border-border/80 bg-card/85 backdrop-blur-md">
          <div className="mx-auto w-full max-w-2xl px-4 py-2.5" data-testid="wizard-progress">
            <Progress
              value={screen as number}
              max={TOTAL_STEPS}
              label={`Step ${screen} of ${TOTAL_STEPS}`}
            />
          </div>
        </div>
      )}

      <main className={`mx-auto w-full max-w-2xl px-4 py-5 ${inFlow ? 'pb-28' : 'pb-10'}`}>
        {screen === 0 && (
          <IntakeForm intake={wizard.intake} onChange={wizard.setIntake} onStart={wizard.start} />
        )}
        {isQuestionScreen && (
          <QuestionScreen
            batch={QUESTION_BATCHES[(screen as number) - 1]}
            batchNumber={screen as 1 | 2}
            prospectName={info.name}
            answers={wizard.answers}
            onSelect={wizard.selectOption}
          />
        )}
        {inFlow && (screen as number) >= 3 && (
          <ObservationScreen
            groupIndex={(screen as number) - 3}
            nv={wizard.nv}
            onToggle={wizard.toggleObservation}
          />
        )}
        {screen === 'R' && wizard.profile && (
          <ResultReport
            profile={wizard.profile}
            intake={info}
            meetingLabel={meetingLabel(info.meeting)}
            dateLabel={formatDisplayDateLong(new Date())}
            notes={wizard.notes}
            onNotesChange={wizard.setNotes}
            isAuthenticated={Boolean(c.user)}
            saveState={c.saveState}
            onPdf={c.handlePdf}
            onCsv={c.handleCsv}
            onReset={c.handleReset}
          />
        )}
      </main>

      {inFlow && (
        <div className="print-hide fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex w-full max-w-2xl gap-2.5 px-4 py-3">
            <Button size="lg" variant="outline" onClick={c.handleBack} data-testid="wizard-back-btn">
              ← Back
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={c.nextDisabled}
              onClick={c.handleNext}
              data-testid="wizard-next-btn"
            >
              {screen === TOTAL_STEPS ? 'Generate Profile →' : 'Next →'}
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={c.exitConfirmOpen}
        onOpenChange={c.setExitConfirmOpen}
        title="Exit profiling?"
        destructive
        size="md"
        testId="wizard-exit-modal"
        footer={
          <>
            <ModalGhostAction onClick={() => c.setExitConfirmOpen(false)} data-testid="wizard-exit-cancel-btn">
              Keep profiling
            </ModalGhostAction>
            <ModalPrimaryAction destructive onClick={c.confirmExit} data-testid="wizard-exit-confirm-btn">
              Exit
            </ModalPrimaryAction>
          </>
        }
      >
        <p className="m-0 text-[13px] leading-6 text-muted-foreground">
          Your answers and ticked observations will be discarded. The prospect details stay filled
          in so you can restart quickly.
        </p>
      </Modal>
    </div>
  );
}
