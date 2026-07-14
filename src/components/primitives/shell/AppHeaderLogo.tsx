/**
 * AppHeaderLogo — Prospect Profiler wordmark; links to /dashboard.
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * 2026-07-07 de-AppBase: Georgia serif wordmark in the original Prospect
 * Profiler style (cream text on navy), replacing the Geist-Mono lockup + flame.
 */
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function AppHeaderLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      to="/dashboard"
      className={cn(
        'inline-flex items-center flex-shrink-0 text-foreground',
        mobile ? 'text-[17px]' : 'text-[19px]',
      )}
      aria-label="Insurance CRM — Home"
      style={{
        fontFamily: 'var(--font-pixel)',
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: '0.01em',
      }}
    >
      Insurance CRM
    </Link>
  );
}
