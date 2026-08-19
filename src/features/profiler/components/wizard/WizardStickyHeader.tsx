/**
 * WizardStickyHeader — ONE sticky block holding the wizard's top bar and its
 * progress rail.
 *
 * They are nested rather than pinned separately on purpose: pinning the rail on
 * its own needed a hardcoded `top-[53px]` that silently broke whenever the
 * bar's height changed. Nesting removes the constant, and that is the whole
 * reason this component exists as one unit — keep them together.
 *
 * Split out of `ProfilerWizardPage` (2026-08-19) when that file crossed the
 * 200-LOC ceiling.
 *
 * Hidden in print via `print-hide` (features/profiler/lib/print.css).
 */

import { cn } from '@/lib/utils';
import { Progress } from '@/components/primitives/form';
import { useScrolled } from '@/hooks/useScrolled';
import { TOTAL_STEPS } from '../../hooks/useWizardState';
import { WizardTopBar } from './WizardTopBar';

interface WizardStickyHeaderProps {
  /** Flow-aware line under the wordmark. */
  subtitle: string;
  isAuthenticated: boolean;
  /** In one of the numbered steps — the progress rail shows only then. */
  inFlow: boolean;
  /** Current step, 1..TOTAL_STEPS. Ignored unless `inFlow`. */
  step: number;
}

export function WizardStickyHeader({
  subtitle,
  isAuthenticated,
  inFlow,
  step,
}: WizardStickyHeaderProps) {
  const scrolled = useScrolled();

  return (
    <div
      className={cn(
        'print-hide sticky top-0 z-40 transition-shadow duration-300 ease-[var(--motion-ease-out-expo)]',
        scrolled && 'shadow-[var(--card-shadow-hover)]',
      )}
    >
      {/* With the rail on screen (authed, ≥ lg) the bar's wordmark + Dashboard
          button duplicate the rail's own chrome — the bar yields to it there
          and stays for mobile + anonymous visitors. */}
      <div className={cn(isAuthenticated && 'lg:hidden')}>
        <WizardTopBar subtitle={subtitle} isAuthenticated={isAuthenticated} />
      </div>
      {inFlow && (
        <div className="border-b border-border bg-card">
          {/* `max-w-[42rem]` mirrors ToolPageShell's `reading` measure so the
              bar, the rail, the content and the footer nav share one column.
              The literal is deliberate — see ToolPageShell. */}
          <div className="mx-auto w-full max-w-[42rem] px-4 py-2.5" data-testid="wizard-progress">
            <Progress value={step} max={TOTAL_STEPS} label={`Step ${step} of ${TOTAL_STEPS}`} />
          </div>
        </div>
      )}
    </div>
  );
}
