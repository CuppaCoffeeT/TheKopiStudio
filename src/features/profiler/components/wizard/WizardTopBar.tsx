/**
 * WizardTopBar — minimal public-page chrome for /profiler (no AppHeaderShell:
 * the route is anonymous-friendly). App title + flow subtitle on the left,
 * Login (logged out) or Dashboard (logged in) on the right. Hidden in print.
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/primitives/shell/Button';

interface WizardTopBarProps {
  /** Legacy `hSub` line: flow-aware subtitle under the app title. */
  subtitle: string;
  /** Authenticated? — switches the right-side link. */
  isAuthenticated: boolean;
}

export function WizardTopBar({ subtitle, isAuthenticated }: WizardTopBarProps) {
  const navigate = useNavigate();

  return (
    <header
      className="print-hide sticky top-0 z-40 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md"
      data-testid="wizard-top-bar"
    >
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <div
            className="text-[15px] leading-tight text-zinc-900 dark:text-zinc-50 truncate"
            style={{ fontFamily: 'var(--font-pixel, var(--font-sans))', fontWeight: 500 }}
          >
            Prospect Profiler
          </div>
          <div
            className="text-zinc-500 dark:text-zinc-400 truncate"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em' }}
          >
            {subtitle}
          </div>
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
