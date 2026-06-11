import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/primitives/shell/SEO';
import { PageTitle } from '@/components/primitives/shell/PageTitle';
import { PageDescription } from '@/components/primitives/shell/PageDescription';
import { Button } from '@/components/primitives/shell/Button';
import { Alert } from '@/components/primitives/overlays/Alert';
import { WizardShell } from '@/components/primitives/overlays/wizard';
import type { StepperStep } from '@/components/primitives/form/Stepper';

/**
 * ProfilerWizardPage — public DISC × MBTI profiling wizard (TOOL archetype).
 *
 * PUBLIC route (/profiler): no ProtectedRoute, no AppHeaderShell — anonymous
 * visitors run the wizard; the page renders its own minimal shell.
 *
 * P1 scaffold stub: composes the real WizardShell primitive with the flow's
 * step structure. The intake form, question screens, observation groups and
 * result report land in Phase P3 (after the P2 lib port).
 */

const WIZARD_STEPS: StepperStep[] = [
  { label: 'Details' },
  { label: 'Questions' },
  { label: 'Observations' },
  { label: 'Result' },
];

export default function ProfilerWizardPage() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(true);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--page-bg, #f4f4f5)' }}
    >
      <SEO title="Prospect Profiler" description="Run a DISC × MBTI prospect profile" />

      <div className="w-full max-w-md text-center space-y-4">
        <PageTitle>Prospect Profiler</PageTitle>
        <PageDescription>
          Profile a prospect with 8 questions and quick observations — no account needed.
        </PageDescription>
        <div className="flex justify-center gap-2">
          <Button variant="primary" onClick={() => setWizardOpen(true)}>
            Start profiling
          </Button>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Log in
          </Button>
        </div>
      </div>

      <WizardShell
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        title="New prospect profile"
        steps={WIZARD_STEPS}
        currentStep={0}
        nextDisabled
        onNext={() => undefined}
        testId="profiler-wizard"
      >
        <Alert
          variant="info"
          title="Wizard under construction"
          description="The profiling flow (intake, questions, observations and the full report) is being built in this module's next phase. Nothing is saved yet."
        />
      </WizardShell>
    </div>
  );
}
