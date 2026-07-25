/**
 * AppHeaderLogo — Insurance CRM wordmark; links to /dashboard.
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * 2026-07-07 de-AppBase: serif wordmark, replacing the former mono lockup +
 * flame. 2026-07-14: text rebranded to "Insurance CRM".
 * 2026-07-25 (2a Kopi House): Instrument Serif 18px ink wordmark, second word
 * brown italic. 18px is the Instrument Serif floor — never set it lower.
 */
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function AppHeaderLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      to="/dashboard"
      className={cn(
        'inline-flex items-center flex-shrink-0 text-foreground text-[18px]',
        mobile && 'text-[18px]', // API kept — the wordmark is 18px on all viewports
      )}
      aria-label="Insurance CRM — Home"
      style={{
        fontFamily: 'var(--font-pixel)',
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: '0.01em',
      }}
    >
      Insurance&nbsp;
      <i style={{ color: 'var(--brand-red)' }}>CRM</i>
    </Link>
  );
}
