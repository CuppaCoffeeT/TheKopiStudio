/**
 * WizardTopBar — the PUBLIC /profiler route's own chrome.
 *
 * /profiler sits outside `DashboardLayout` and outside `ProtectedRoute` so
 * anonymous visitors can run a profile; it therefore never gets `AppSidebar`.
 * That makes this bar the tool's entire identity surface, which is why it
 * carries the shared `Wordmark` — the public tool and the signed-in app must
 * read as one brand. The flow-aware line sits under it as the 2a dateline
 * (600 11px, .14em, uppercase, muted), the same kicker treatment the app's
 * mastheads use. Right side: Login (logged out) or Dashboard (logged in).
 *
 * 2a treatment: card cream on the page cream, closed by ONE hairline. No blur,
 * no translucency — in this direction hairlines carry the layout and every
 * surface is opaque.
 *
 * NOT sticky itself: `ProfilerWizardPage` wraps this bar and the progress rail
 * in a single sticky block, so the progress bar can never fall out of step with
 * this bar's height (it used to be pinned to a hardcoded `top-[53px]`).
 * Hidden in print via `print-hide` (features/profiler/lib/print.css).
 *
 * `max-w-[42rem]` mirrors the page's reading column — see the note in
 * `ProfilerWizardPage` for why `max-w-2xl` cannot be used here.
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/primitives/shell/Button';
import { Wordmark } from '@/components/primitives/shell/Wordmark';

interface WizardTopBarProps {
  /** Legacy `hSub` line: flow-aware subtitle under the wordmark. */
  subtitle: string;
  /** Authenticated? — switches the right-side link. */
  isAuthenticated: boolean;
}

export function WizardTopBar({ subtitle, isAuthenticated }: WizardTopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="print-hide border-b border-border bg-card" data-testid="wizard-top-bar">
      <div className="mx-auto flex w-full max-w-[42rem] items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <Wordmark className="block text-[22px] leading-[1.15] text-foreground" />
          {/* Muted reads 4.72:1 on the card cream this bar paints — the "muted
              on page" gap the spec flags does not apply here. */}
          <p
            className="m-0 mt-0.5 truncate uppercase text-muted-foreground"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
            }}
          >
            {subtitle}
          </p>
        </div>
        {isAuthenticated ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/dashboard')}
            data-testid="wizard-dashboard-link"
          >
            Dashboard
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/login')}
            data-testid="wizard-login-link"
          >
            Log in
          </Button>
        )}
      </div>
    </header>
  );
}
