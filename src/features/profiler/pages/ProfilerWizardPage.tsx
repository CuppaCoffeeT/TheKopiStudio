/**
 * ProfilerWizardPage — DISC × MBTI profiling wizard, tool 01 (TOOL archetype).
 *
 * PUBLIC route (/profiler): no ProtectedRoute, no AppHeaderShell — anonymous
 * visitors run the full flow.
 *
 * TWO FRONT DOORS, one route (2026-08-19). `src/lib/toolRoutes` has always
 * listed this as tool 01 beside the tax calculator, the SRS planner and the
 * Legacy Map, but the page opened in a visual language none of them share.
 * The intake screen now branches on the viewer:
 *
 * - **Signed in** — the tool shell tools 04–06 use: `ToolPageHeader`
 *   (breadcrumb → brown "01" → serif title → description) over
 *   `ToolCustomerBar`, on `ToolPageShell`'s padding and cream. An advisor can
 *   now pick WHO they are profiling here instead of only arriving pre-linked
 *   from a customer record; the picker writes the same `?prospect=&customerId=`
 *   pair that entry does (`useWizardController.chooseCustomer`).
 * - **Anonymous** — the marketing hero and `WizardTopBar` stay exactly as they
 *   were. /profiler is a public landing page for visitors with no account, and
 *   a numbered breadcrumb into an app they cannot reach is chrome, not welcome.
 *
 * The shell appears on the INTAKE screen only. Once in flow the sticky progress
 * rail is the page's identity, and a 38px masthead over every question screen
 * would push the answering column down seven times for nothing.
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
 *
 * Reading column: `ToolPageShell measure="reading"` — `max-w-[42rem]`, and the
 * literal is deliberate (see that file). `WizardTopBar` mirrors it so the bar,
 * the progress rail, the content and the footer nav share one column.
 */

import { cn } from '@/lib/utils';
import { useScrolled } from '@/hooks/useScrolled';
import { AppSidebar, SIDEBAR_OFFSET_CLASS } from '@/components/primitives/shell';
import { SEO } from '@/components/primitives/shell/SEO';
import {
  ToolCustomerBar,
  ToolPageHeader,
  ToolPageShell,
} from '@/components/primitives/tools';
import type { SMSOption } from '@/components/primitives/overlays';
import { WizardBottomBar } from '../components/wizard/WizardBottomBar';
import { Progress } from '@/components/primitives/form';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { toolRouteByKey } from '@/lib/toolRoutes';
import { meetingLabel } from '../lib/meeting';
import { TOTAL_STEPS } from '../hooks/useWizardState';
import { QUESTION_BATCHES, useWizardController } from '../hooks/useWizardController';
import { useOwnCustomerOptions } from '../hooks/useOwnCustomerOptions';
import { WizardTopBar } from '../components/wizard/WizardTopBar';
import { IntakeForm } from '../components/wizard/IntakeForm';
import { QuestionScreen } from '../components/wizard/QuestionScreen';
import { ObservationScreen } from '../components/wizard/ObservationScreen';
import { ResultReport } from '../components/wizard/result/ResultReport';
import '../lib/print.css';

/** Title + one-line description come from the tool list, like every other tool. */
const PROFILER_TOOL = toolRouteByKey('profiler');

export default function ProfilerWizardPage() {
  const c = useWizardController();
  const { wizard, info, screen, inFlow, isQuestionScreen } = c;
  const scrolled = useScrolled();
  // Signed-in advisors get the app rail (≥ lg) so the wizard reads as part of
  // the shell; anonymous visitors keep the rail-free public flow. The route
  // itself stays public — this is chrome, not access control.
  const authed = Boolean(c.user);

  // The tool shell is the signed-in advisor's front door, and only at intake —
  // see the header note.
  const showToolShell = authed && screen === 0;

  // Parked until the picker is actually on screen: an anonymous visitor has no
  // book, and mid-flow nobody is choosing a customer.
  const customers = useOwnCustomerOptions(showToolShell);
  const customerOptions: SMSOption[] = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  // The CRM entry contract (?prospect= + ?customerId=) is read in
  // useWizardController — it owns both the intake seed and the save payload.

  // Live count for the disabled-Next explanation on question screens.
  //
  // `!== null`, NOT `!== undefined` (fixed 2026-08-19). `useWizardState` seeds
  // `answers` with `new Array(8).fill(null)`, so every slot is defined from the
  // first render and the old test counted all four before a single option was
  // picked: the bar read "All 4 answered" beside a disabled Next, and the
  // aria-live region announced it. `isBatchComplete` has always used `!== null`,
  // which is why only the hint was wrong and the gating was right.
  const answeredInBatch = isQuestionScreen
    ? QUESTION_BATCHES[(screen as number) - 1].filter((qi) => wizard.answers[qi] !== null).length
    : 0;

  return (
    <div className="min-h-svh bg-background">
      <SEO title="Prospect Profiler" description="Run a DISC × MBTI prospect profile" />
      {authed && <AppSidebar />}
      <div className={cn(authed && [SIDEBAR_OFFSET_CLASS, 'print:pl-0!'])}>
      {/* ONE sticky block for the bar + the progress rail. Pinning them
          separately needed a hardcoded `top-[53px]` that silently broke
          whenever the bar's height changed; nesting removes the constant. */}
      <div
        className={cn(
          'print-hide sticky top-0 z-40 transition-shadow duration-300 ease-[var(--motion-ease-out-expo)]',
          scrolled && 'shadow-[var(--card-shadow-hover)]',
        )}
      >
        {/* With the rail on screen (authed, ≥ lg) the bar's wordmark + Dashboard
            button duplicate the rail's own chrome — the bar yields to it there
            and stays for mobile + anonymous visitors. */}
        <div className={cn(authed && 'lg:hidden')}>
          <WizardTopBar subtitle={c.subtitle} isAuthenticated={authed} />
        </div>
        {inFlow && (
          <div className="border-b border-border bg-card">
            <div className="mx-auto w-full max-w-[42rem] px-4 py-2.5" data-testid="wizard-progress">
              <Progress
                value={screen as number}
                max={TOTAL_STEPS}
                label={`Step ${screen} of ${TOTAL_STEPS}`}
              />
            </div>
          </div>
        )}
      </div>

      <ToolPageShell as="main" measure="reading" className={inFlow ? 'pb-28' : 'pb-12'}>
        {showToolShell && (
          <>
            <ToolPageHeader
              index="01"
              title={PROFILER_TOOL.label}
              description={PROFILER_TOOL.description}
              testId="profiler"
            />
            <ToolCustomerBar
              value={c.customerId}
              onChange={(next) =>
                c.chooseCustomer(
                  next
                    ? {
                        id: next,
                        name:
                          customerOptions.find((option) => option.value === next)?.label ?? '',
                      }
                    : null,
                )
              }
              options={customerOptions}
              isLoading={customers.isLoading}
              isError={customers.isError}
              onRetry={() => void customers.refetch()}
              blankHint="No customer chosen — the profile saves unlinked. Pick one to fill the name and file the result on their record."
              chosenHint="The name is filled in, and the finished profile files itself on their record."
              testId="profiler-customer-bar"
            />
          </>
        )}

        {screen === 0 && (
          <IntakeForm
            intake={wizard.intake}
            onChange={wizard.setIntake}
            onStart={wizard.start}
            /* The hero is the PUBLIC landing page. A signed-in advisor already
               got the tool header above and does not need to be sold the tool
               they just opened. */
            showHero={!authed}
          />
        )}
        {isQuestionScreen && (
          <QuestionScreen
            batch={QUESTION_BATCHES[(screen as number) - 1]}
            batchNumber={screen as 1 | 2}
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
      </ToolPageShell>
      </div>

      {inFlow && (
        <WizardBottomBar
          isLastStep={screen === TOTAL_STEPS}
          nextDisabled={c.nextDisabled}
          onBack={c.handleBack}
          onNext={c.handleNext}
          answeredInBatch={isQuestionScreen ? answeredInBatch : null}
          railOffset={authed}
        />
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
