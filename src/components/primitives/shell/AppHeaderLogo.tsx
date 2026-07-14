/**
 * AppHeaderLogo — Insurance CRM wordmark; links to /dashboard.
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * 2026-07-07 de-AppBase: serif wordmark (cream text on navy), replacing the
 * Geist-Mono lockup + flame. 2026-07-14: text rebranded to "Insurance CRM".
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
